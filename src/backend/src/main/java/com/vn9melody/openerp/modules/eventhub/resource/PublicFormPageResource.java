package com.vn9melody.openerp.modules.eventhub.resource;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

/**
 * Public fill page (ADR-S08-003 §2): a minimal no-auth HTML bootstrap that
 * mints an anonymous session and mounts the plugin's fill web component. The
 * page contains no data — everything is fetched by the WC through the runtime
 * gateway with the anonymous token.
 */
@Path("/public/forms")
public class PublicFormPageResource {

    @GET
    @Path("/{tenantSlug}/{formSlug}")
    @Produces(MediaType.TEXT_HTML)
    public String page(@PathParam("tenantSlug") String tenantSlug,
            @PathParam("formSlug") String formSlug) {
        String safeTenant = tenantSlug.replaceAll("[^a-z0-9-]", "");
        String safeForm = formSlug.replaceAll("[^a-z0-9_-]", "");
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                  <meta charset="utf-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <title>Form</title>
                  <style>
                    :root { color-scheme: light dark; }
                    body { margin: 0; font-family: system-ui, sans-serif; background: #f5f5f4; }
                    #fill { max-width: 720px; margin: 0 auto; padding: 16px; }
                    #status { padding: 48px 16px; text-align: center; color: #525252; font-size: 14px; }
                  </style>
                </head>
                <body>
                  <div id="fill"><div id="status">Loading form...</div></div>
                  <script type="module">
                    const tenantSlug = '%TENANT%';
                    const formSlug = '%FORM%';
                    const status = document.getElementById('status');
                    try {
                      const sessionResponse = await fetch('/api/v1/plugins/public-session/form', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tenant_slug: tenantSlug, ref: formSlug })
                      });
                      const sessionBody = await sessionResponse.json();
                      if (!sessionResponse.ok || !sessionBody.success) {
                        throw new Error(sessionBody.code || 'SESSION_FAILED');
                      }
                      const token = sessionBody.data.token;
                      const script = document.createElement('script');
                      script.type = 'module';
                      script.src = '/api/v1/plugins/runtime/form/main.js?plugin_token=' + encodeURIComponent(token);
                      script.onload = async () => {
                        try {
                          await customElements.whenDefined('op-form-fill');
                          const host = document.getElementById('fill');
                          host.innerHTML = '';
                          const element = document.createElement('op-form-fill');
                          element.setAttribute('form-slug', formSlug);
                          element.setAttribute('tenant-slug', tenantSlug);
                          element.setAttribute('plugin-token', token);
                          host.appendChild(element);
                        } catch (error) {
                          status.textContent = 'Form is unavailable.';
                        }
                      };
                      script.onerror = () => { status.textContent = 'Form is unavailable.'; };
                      document.head.appendChild(script);
                    } catch (error) {
                      status.textContent = error.message === 'PUBLIC_RATE_LIMITED'
                        ? 'Too many requests. Please retry later.'
                        : 'This form is not available.';
                    }
                  </script>
                </body>
                </html>
                """
                .replace("%TENANT%", safeTenant)
                .replace("%FORM%", safeForm);
    }
}
