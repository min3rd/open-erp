package com.vn9melody.openerp.core.enums;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class CompanySizeConverter implements AttributeConverter<CompanySize, String> {

    @Override
    public String convertToDatabaseColumn(CompanySize attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getCode();
    }

    @Override
    public CompanySize convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }
        return CompanySize.fromCode(dbData);
    }
}
