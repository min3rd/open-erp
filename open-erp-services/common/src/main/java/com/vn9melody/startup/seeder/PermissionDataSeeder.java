package com.vn9melody.startup.seeder;

import com.vn9melody.entities.Permission;
import com.vn9melody.enums.ModuleCode;
import com.vn9melody.enums.PermissionCode;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@ApplicationScoped
public class PermissionDataSeeder {

    private static final Logger LOG = Logger.getLogger(PermissionDataSeeder.class);

    @Transactional
    public void onStart(@Observes StartupEvent ev) {
        LOG.info("Bắt đầu đồng bộ danh mục Permission từ Enum vào Database...");

        // 1. Lấy toàn bộ permission hiện có trong database
        List<Permission> existingPermissions = Permission.listAll();
        Map<PermissionCode, Permission> existingMap = existingPermissions.stream()
                .filter(p -> p.code != null)
                .collect(Collectors.toMap(p -> p.code, p -> p, (p1, p2) -> p1));

        int insertedCount = 0;
        int updatedCount = 0;

        // 2. Duyệt qua toàn bộ giá trị trong Enum PermissionCode
        for (PermissionCode permCode : PermissionCode.values()) {
            Permission existing = existingMap.get(permCode);

            if (existing == null) {
                // Thêm mới nếu chưa có trong DB
                Permission newPermission = new Permission();
                newPermission.code = permCode;
                newPermission.module = permCode.getModule();
                newPermission.description = permCode.getDescription();
                newPermission.persist();

                insertedCount++;
                LOG.debugf("Đã thêm mới permission: %s", permCode);
            } else {
                // Cập nhật module / description nếu có thay đổi trong Enum
                boolean modified = false;
                if (existing.module != permCode.getModule()) {
                    existing.module = permCode.getModule();
                    modified = true;
                }
                if (!java.util.Objects.equals(existing.description, permCode.getDescription())) {
                    existing.description = permCode.getDescription();
                    modified = true;
                }

                if (modified) {
                    updatedCount++;
                    LOG.debugf("Đã cập nhật thông tin permission: %s", permCode);
                }
            }
        }

        LOG.infof("Hoàn tất đồng bộ Permission: Thêm mới %d, Cập nhật %d, Tổng số %d.",
                insertedCount, updatedCount, PermissionCode.values().length);
    }
}