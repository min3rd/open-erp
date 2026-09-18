package com.vn9melody.openerp.core.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class ListData<T> {
    @JsonProperty("items")
    private List<T> items;

    public ListData() {
    }

    public ListData(List<T> items) {
        this.items = items;
    }

    public static <T> ListData<T> of(List<T> items) {
        return new ListData<>(items);
    }

    public List<T> getItems() {
        return items;
    }

    public void setItems(List<T> items) {
        this.items = items;
    }
}
