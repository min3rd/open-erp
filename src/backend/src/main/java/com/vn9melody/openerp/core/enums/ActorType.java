package com.vn9melody.openerp.core.enums;

public enum ActorType {
    USER,
    SUPER_ADMIN,
    SUPPORT_ENGINEER,
    SYSTEM,
    CLI;

    public static ActorType fromString(String value) {
        if (value == null) {
            return USER;
        }
        for (ActorType actorType : values()) {
            if (actorType.name().equalsIgnoreCase(value.trim())) {
                return actorType;
            }
        }
        return USER;
    }
}
