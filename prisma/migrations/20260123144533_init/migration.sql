-- CreateTable
CREATE TABLE `reunio_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `provider_account_id` VARCHAR(191) NOT NULL,
    `refresh_token` TEXT NULL,
    `access_token` TEXT NULL,
    `expires_at` INTEGER NULL,
    `token_type` VARCHAR(191) NULL,
    `scope` VARCHAR(191) NULL,
    `id_token` TEXT NULL,
    `session_state` VARCHAR(191) NULL,

    UNIQUE INDEX `reunio_accounts_provider_provider_account_id_key`(`provider`, `provider_account_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reunio_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `session_token` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reunio_sessions_session_token_key`(`session_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reunio_verification_tokens` (
    `identifier` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expires` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reunio_verification_tokens_token_key`(`token`),
    UNIQUE INDEX `reunio_verification_tokens_identifier_token_key`(`identifier`, `token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reunio_users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `email_verified` DATETIME(3) NULL,
    `password` VARCHAR(191) NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `avatar_url` VARCHAR(191) NULL,
    `role` ENUM('USER', 'ADMIN', 'SUPERADMIN') NOT NULL DEFAULT 'USER',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reunio_users_email_key`(`email`),
    INDEX `reunio_users_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reunio_branches` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'America/Sao_Paulo',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reunio_rooms` (
    `id` VARCHAR(191) NOT NULL,
    `branch_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `capacity` INTEGER NOT NULL DEFAULT 1,
    `equipment_list` JSON NOT NULL,
    `description` TEXT NULL,
    `floor` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `reunio_rooms_branch_id_idx`(`branch_id`),
    INDEX `reunio_rooms_capacity_idx`(`capacity`),
    UNIQUE INDEX `reunio_rooms_branch_id_name_key`(`branch_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reunio_bookings` (
    `id` VARCHAR(191) NOT NULL,
    `room_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `creator_name` VARCHAR(191) NOT NULL,
    `creator_email` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NOT NULL,
    `is_recurring` BOOLEAN NOT NULL DEFAULT false,
    `recurrence_type` VARCHAR(191) NULL,
    `parent_booking_id` VARCHAR(191) NULL,
    `status` ENUM('CONFIRMED', 'CANCELLED', 'PENDING') NOT NULL DEFAULT 'CONFIRMED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `reunio_bookings_room_id_idx`(`room_id`),
    INDEX `reunio_bookings_user_id_idx`(`user_id`),
    INDEX `reunio_bookings_start_time_end_time_idx`(`start_time`, `end_time`),
    INDEX `reunio_bookings_parent_booking_id_idx`(`parent_booking_id`),
    INDEX `reunio_bookings_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reunio_cancellation_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `booking_id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,

    INDEX `reunio_cancellation_tokens_booking_id_idx`(`booking_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reunio_accounts` ADD CONSTRAINT `reunio_accounts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `reunio_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reunio_sessions` ADD CONSTRAINT `reunio_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `reunio_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reunio_rooms` ADD CONSTRAINT `reunio_rooms_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `reunio_branches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reunio_bookings` ADD CONSTRAINT `reunio_bookings_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `reunio_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reunio_bookings` ADD CONSTRAINT `reunio_bookings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `reunio_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reunio_bookings` ADD CONSTRAINT `reunio_bookings_parent_booking_id_fkey` FOREIGN KEY (`parent_booking_id`) REFERENCES `reunio_bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reunio_cancellation_tokens` ADD CONSTRAINT `reunio_cancellation_tokens_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `reunio_bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
