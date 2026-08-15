package com.vn9melody.entities;

import org.hibernate.annotations.SQLRestriction;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "tenants")
@SQLRestriction("is_deleted = false")
public class Tenant extends BaseAuditEntity {

}
