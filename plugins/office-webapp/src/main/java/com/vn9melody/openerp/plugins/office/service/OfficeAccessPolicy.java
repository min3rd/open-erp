package com.vn9melody.openerp.plugins.office.service;

import com.vn9melody.openerp.plugins.office.dto.OfficeDocumentDto;
import com.vn9melody.openerp.plugins.office.dto.OfficeDocumentPermissionDto;

import java.util.List;
import java.util.UUID;

/** Pure ACL policy so access rules are testable without the data gateway. */
public final class OfficeAccessPolicy {

    private OfficeAccessPolicy() {}

    public static boolean isOwner(OfficeDocumentDto document, UUID userId) {
        return document != null && userId != null && userId.equals(document.createdBy());
    }

    public static boolean canRead(OfficeDocumentDto document, UUID userId, boolean platform,
                                  List<OfficeDocumentPermissionDto> permissions) {
        if (platform || isOwner(document, userId)) return true;
        return permissions.stream().anyMatch(permission ->
                "USER".equalsIgnoreCase(permission.subjectType())
                        && userId != null
                        && userId.equals(permission.subjectId())
                        && ("READ".equalsIgnoreCase(permission.permission()) || "WRITE".equalsIgnoreCase(permission.permission())));
    }

    public static boolean canWrite(OfficeDocumentDto document, UUID userId, boolean platform,
                                   List<OfficeDocumentPermissionDto> permissions) {
        if (platform || isOwner(document, userId)) return true;
        return permissions.stream().anyMatch(permission ->
                "USER".equalsIgnoreCase(permission.subjectType())
                        && userId != null
                        && userId.equals(permission.subjectId())
                        && "WRITE".equalsIgnoreCase(permission.permission()));
    }

    public static boolean canManage(OfficeDocumentDto document, UUID userId, boolean platform) {
        return platform || isOwner(document, userId);
    }
}
