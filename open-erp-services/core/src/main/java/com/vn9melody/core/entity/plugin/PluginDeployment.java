package com.vn9melody.core.entity.plugin;

import jakarta.persistence.*;
import java.time.Instant;
import com.vn9melody.common.entity.BaseAuditEntity;

@Entity
@Table(name = "plugin_deployments")
public class PluginDeployment extends BaseAuditEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "version_id")
    public PluginVersion pluginVersion;

    @Column(name = "k8s_namespace", length = 100)
    public String k8sNamespace = "default";

    @Column(name = "k8s_deployment_name", length = 150)
    public String k8sDeploymentName;

    @Column(name = "k8s_service_name", length = 150)
    public String k8sServiceName;

    @Column(name = "service_port")
    public Integer servicePort = 8080;

    @Column(name = "replicas")
    public Integer replicas = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "runtime_status", length = 30, nullable = false)
    public RuntimeStatus runtimeStatus = RuntimeStatus.PENDING;

    @Column(name = "health_check_url", length = 255)
    public String healthCheckUrl;

    @Column(name = "last_error_log", columnDefinition = "TEXT")
    public String lastErrorLog;

    @Column(name = "deployed_at")
    public Instant deployedAt;
}