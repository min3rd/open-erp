create table if not exists platform_notification_settings (
    id boolean primary key default true,
    display_name varchar(160) not null default 'Open-ERP',
    support_email varchar(255),
    channel_email boolean not null default false,
    channel_in_app boolean not null default true,
    level_min varchar(16) not null default 'INFO',
    updated_at timestamp with time zone not null default now(),
    updated_by uuid,
    constraint platform_notification_settings_singleton check (id)
);

insert into platform_notification_settings (id)
values (true)
on conflict (id) do nothing;
