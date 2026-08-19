package com.vn9melody.core.plugin.service;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.InputStream;
import java.nio.file.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@ApplicationScoped
public class PluginArtifactService {

    @ConfigProperty(name = "plugin.storage.base-dir", defaultValue = "/opt/erp/plugins")
    String baseStorageDir;

    @ConfigProperty(name = "plugin.static.webroot", defaultValue = "/var/www/plugins")
    String webrootStaticDir;

    public void extractZipBundle(String pluginKey, String version, InputStream zipStream) throws Exception {
        Path targetDir = Paths.get(baseStorageDir, pluginKey, version);
        Files.createDirectories(targetDir);

        try (ZipInputStream zis = new ZipInputStream(zipStream)) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                Path newPath = targetDir.resolve(entry.getName()).normalize();
                if (entry.isDirectory()) {
                    Files.createDirectories(newPath);
                } else {
                    Files.createDirectories(newPath.getParent());
                    Files.copy(zis, newPath, StandardCopyOption.REPLACE_EXISTING);
                }
                zis.closeEntry();
            }
        }

        // Đồng bộ thư mục frontend/dist sang Webroot của Nginx để Angular Shell load
        Path distSource = targetDir.resolve("frontend/dist");
        if (Files.exists(distSource)) {
            Path distTarget = Paths.get(webrootStaticDir, pluginKey);
            Files.createDirectories(distTarget);
            // Copy đè static files
            copyDirectory(distSource, distTarget);
        }
    }

    private void copyDirectory(Path source, Path target) throws Exception {
        try (var stream = Files.walk(source)) {
            stream.forEach(src -> {
                try {
                    Path dest = target.resolve(source.relativize(src));
                    if (Files.isDirectory(src)) {
                        Files.createDirectories(dest);
                    } else {
                        Files.copy(src, dest, StandardCopyOption.REPLACE_EXISTING);
                    }
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            });
        }
    }
}