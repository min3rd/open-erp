package com.vn9melody.openerp.core.registry;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;
import jakarta.inject.Singleton;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Enumeration;
import java.util.Iterator;
import java.util.stream.Stream;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;
import org.jboss.jandex.Index;
import org.jboss.jandex.IndexReader;
import org.jboss.jandex.IndexView;
import org.jboss.jandex.Indexer;
import org.jboss.logging.Logger;

/**
 * Produces the Jandex {@link IndexView} used by the Entity Registry.
 *
 * <p>Quarkus 3.15 does not expose the application index as an injectable bean, so the index is
 * built at startup: a build-time {@code META-INF/jandex.idx} is used when present, otherwise the
 * application classes are indexed on the fly with Jandex.</p>
 */
@ApplicationScoped
public class ApplicationIndexProducer {

    private static final Logger LOG = Logger.getLogger(ApplicationIndexProducer.class);
    private static final String JANDEX_INDEX_RESOURCE = "META-INF/jandex.idx";

    @Produces
    @Singleton
    public IndexView applicationIndex() {
        ClassLoader classLoader = Thread.currentThread().getContextClassLoader();

        URL location = locateApplicationClasses(classLoader);
        if (location == null) {
            LOG.warn("Entity Registry: unable to locate application classes, Jandex index will be empty");
            return new Indexer().complete();
        }

        try {
            Index packaged = readPackagedIndex(location);
            if (packaged != null) {
                LOG.debugf("Entity Registry: Jandex index loaded from %s", JANDEX_INDEX_RESOURCE);
                return packaged;
            }

            Indexer indexer = new Indexer();
            indexLocation(location, indexer);
            Index index = indexer.complete();
            LOG.debugf("Entity Registry: Jandex index built from %s (%d classes)",
                location, index.getKnownClasses().size());
            return index;
        } catch (Exception e) {
            LOG.errorf(e, "Entity Registry: failed to build Jandex index from %s", location);
            return new Indexer().complete();
        }
    }

    private Index readPackagedIndex(URL location) {
        try {
            if ("jar".equals(location.getProtocol())) {
                String path = location.getPath();
                int separator = path.indexOf("!/");
                String jarPath = separator > 0 ? path.substring(0, separator) : path;
                try (JarFile jarFile = new JarFile(Paths.get(java.net.URI.create(jarPath)).toFile())) {
                    JarEntry indexEntry = jarFile.getJarEntry(JANDEX_INDEX_RESOURCE);
                    if (indexEntry == null) {
                        return null;
                    }
                    try (InputStream in = jarFile.getInputStream(indexEntry)) {
                        return new IndexReader(in).read();
                    }
                }
            }

            Path root = Paths.get(location.toURI());
            if (Files.isDirectory(root)) {
                Path indexFile = root.resolve(JANDEX_INDEX_RESOURCE);
                if (!Files.isRegularFile(indexFile)) {
                    return null;
                }
                try (InputStream in = Files.newInputStream(indexFile)) {
                    return new IndexReader(in).read();
                }
            }
        } catch (Exception e) {
            LOG.warnf("Entity Registry: unable to read %s from %s: %s",
                JANDEX_INDEX_RESOURCE, location, e.getMessage());
        }
        return null;
    }

    private URL locateApplicationClasses(ClassLoader classLoader) {
        try {
            var protectionDomain = ApplicationIndexProducer.class.getProtectionDomain();
            if (protectionDomain != null && protectionDomain.getCodeSource() != null
                    && protectionDomain.getCodeSource().getLocation() != null) {
                return protectionDomain.getCodeSource().getLocation();
            }
        } catch (Exception ignored) {
            // fall through to classloader lookup
        }

        String resourceName = RegisterEntity.class.getName().replace('.', '/') + ".class";
        URL resource = classLoader.getResource(resourceName);
        if (resource == null) {
            resource = RegisterEntity.class.getResource("RegisterEntity.class");
        }
        if (resource == null) {
            return null;
        }

        String url = resource.toExternalForm();
        if ("jar".equals(resource.getProtocol())) {
            int separator = url.indexOf("!/");
            if (separator > 0) {
                try {
                    return new URL(url.substring(0, separator));
                } catch (IOException e) {
                    return null;
                }
            }
        }
        if ("file".equals(resource.getProtocol())) {
            try {
                return new URL(url.substring(0, url.length() - resourceName.length()));
            } catch (IOException e) {
                return null;
            }
        }
        return null;
    }

    private void indexLocation(URL location, Indexer indexer) throws IOException {
        if ("jar".equals(location.getProtocol())) {
            String path = location.getPath();
            int separator = path.indexOf("!/");
            String jarPath = separator > 0 ? path.substring(0, separator) : path;
            indexJar(Paths.get(java.net.URI.create(jarPath)), indexer);
            return;
        }

        Path root;
        try {
            root = Paths.get(location.toURI());
        } catch (Exception e) {
            throw new IOException("Unsupported classpath location: " + location, e);
        }
        if (Files.isDirectory(root)) {
            indexDirectory(root, indexer);
        } else if (Files.isRegularFile(root)) {
            indexJar(root, indexer);
        }
    }

    private void indexDirectory(Path root, Indexer indexer) throws IOException {
        try (Stream<Path> stream = Files.walk(root)) {
            Iterator<Path> files = stream
                .filter(Files::isRegularFile)
                .filter(path -> path.toString().endsWith(".class"))
                .filter(path -> !"module-info.class".equals(path.getFileName().toString()))
                .iterator();
            while (files.hasNext()) {
                Path classFile = files.next();
                try (InputStream in = Files.newInputStream(classFile)) {
                    indexer.index(in);
                } catch (Exception e) {
                    LOG.debugf("Entity Registry: skipping %s (%s)", classFile, e.getMessage());
                }
            }
        }
    }

    private void indexJar(Path jarPath, Indexer indexer) throws IOException {
        try (JarFile jarFile = new JarFile(jarPath.toFile())) {
            Enumeration<JarEntry> entries = jarFile.entries();
            while (entries.hasMoreElements()) {
                JarEntry entry = entries.nextElement();
                if (entry.isDirectory() || !entry.getName().endsWith(".class")
                        || entry.getName().startsWith("META-INF/")
                        || entry.getName().endsWith("module-info.class")) {
                    continue;
                }
                try (InputStream in = jarFile.getInputStream(entry)) {
                    indexer.index(in);
                } catch (Exception e) {
                    LOG.debugf("Entity Registry: skipping %s (%s)", entry.getName(), e.getMessage());
                }
            }
        }
    }
}
