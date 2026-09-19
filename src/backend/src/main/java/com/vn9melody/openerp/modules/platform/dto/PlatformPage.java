package com.vn9melody.openerp.modules.platform.dto;

import java.util.List;

/** Internal pagination carrier; resources map it to the PagedData envelope. */
public class PlatformPage<T> {

    public final List<T> items;
    public final long totalItems;

    public PlatformPage(List<T> items, long totalItems) {
        this.items = items;
        this.totalItems = totalItems;
    }
}
