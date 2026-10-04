package com.vn9melody.openerp.core.enums;

public enum ActorType {
    USER,
    SUPER_ADMIN,
    SUPPORT_ENGINEER,
    SYSTEM,
    CLI;

    public static ActorType fromString(String value) {
        return EnumParser.parse(ActorType.class, value, USER);
    }
}
