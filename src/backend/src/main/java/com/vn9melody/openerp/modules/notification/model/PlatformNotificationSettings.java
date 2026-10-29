package com.vn9melody.openerp.modules.notification.model;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Platform-wide default notification settings, overridable per tenant. */
@Entity
@Table(name = "platform_notification_settings")
public class PlatformNotificationSettings extends PanacheEntityBase {

    @Id
    @Column(name = "id", nullable = false)
    public Boolean id;

    @Column(name = "display_name", nullable = false, length = 160)
    public String displayName;

    @Column(name = "support_email", length = 255)
    public String supportEmail;

    @Column(name = "channel_email", nullable = false)
    public boolean channelEmail;

    @Column(name = "channel_in_app", nullable = false)
    public boolean channelInApp;

    @Column(name = "level_min", nullable = false, length = 16)
    public String levelMin;

    @Column(name = "updated_at", nullable = false)
    public Instant updatedAt;

    @Column(name = "updated_by")
    public UUID updatedBy;
}
