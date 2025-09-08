-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 08, 2025 at 05:42 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lakbai_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `drivers`
--

CREATE TABLE `drivers` (
  `id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `license_number` varchar(50) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jeepneys`
--

CREATE TABLE `jeepneys` (
  `id` int(11) NOT NULL,
  `jeepney_number` varchar(20) NOT NULL,
  `plate_number` varchar(20) NOT NULL,
  `model` varchar(50) NOT NULL,
  `capacity` int(3) NOT NULL DEFAULT 20,
  `route_id` int(11) DEFAULT NULL,
  `driver_id` int(11) DEFAULT NULL,
  `status` enum('active','inactive','maintenance') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `routes`
--

CREATE TABLE `routes` (
  `id` int(11) NOT NULL,
  `route_name` varchar(100) NOT NULL,
  `origin` varchar(100) NOT NULL,
  `destination` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `fare_base` decimal(8,2) DEFAULT 8.00,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `routes`
--

INSERT INTO `routes` (`id`, `route_name`, `origin`, `destination`, `description`, `fare_base`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Robinson Tejero - Robinson Pala-pala', 'Robinson Tejero', 'Robinson Pala-pala', 'Main route connecting Robinson malls', 8.00, 'active', '2025-09-08 02:05:25', '2025-09-08 02:05:25'),
(2, 'Ayala Center - Lahug', 'Ayala Center Cebu', 'Lahug', 'Business district to residential area', 8.00, 'active', '2025-09-08 02:05:25', '2025-09-08 02:05:25'),
(3, 'SM City Cebu - IT Park', 'SM City Cebu', 'IT Park', 'Shopping center to business district', 8.00, 'active', '2025-09-08 02:05:25', '2025-09-08 02:05:25'),
(4, 'Colon Street - USC Main', 'Colon Street', 'USC Main Campus', 'Historic downtown to university', 8.00, 'active', '2025-09-08 02:05:25', '2025-09-08 02:05:25'),
(5, 'Fuente Circle - Capitol Site', 'Fuente Circle', 'Capitol Site', 'Central area to government district', 8.00, 'active', '2025-09-08 02:05:25', '2025-09-08 02:05:25'),
(6, 'Ayala Center - SM City Cebu', 'Ayala Center Cebu', 'SM City Cebu', 'Major shopping centers connection', 8.00, 'active', '2025-09-08 02:05:25', '2025-09-08 02:05:25'),
(7, 'Lahug - IT Park', 'Lahug', 'IT Park', 'Residential to business district', 8.00, 'active', '2025-09-08 02:05:25', '2025-09-08 02:05:25'),
(8, 'USC Main - Ayala Center', 'USC Main Campus', 'Ayala Center Cebu', 'University to business district', 8.00, 'active', '2025-09-08 02:05:25', '2025-09-08 02:05:25');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `birthday` date NOT NULL,
  `gender` enum('Male','Female') NOT NULL,
  `house_number` varchar(20) NOT NULL,
  `street_name` varchar(100) NOT NULL,
  `barangay` varchar(100) NOT NULL,
  `city_municipality` varchar(100) NOT NULL,
  `province` varchar(100) NOT NULL,
  `postal_code` char(4) NOT NULL,
  `user_type` enum('passenger','driver','admin') NOT NULL DEFAULT 'passenger',
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `discount_type` enum('PWD','Senior Citizen','Student') DEFAULT NULL,
  `discount_document_path` varchar(255) DEFAULT NULL,
  `discount_document_name` varchar(255) DEFAULT NULL,
  `drivers_license_path` varchar(255) DEFAULT NULL,
  `drivers_license_name` varchar(255) DEFAULT NULL,
  `drivers_license_verified` tinyint(1) NOT NULL DEFAULT 0,
  `discount_verified` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `license_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `shift_status` enum('on_shift','off_shift') DEFAULT 'off_shift',
  `last_active` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `first_name`, `last_name`, `phone_number`, `birthday`, `gender`, `house_number`, `street_name`, `barangay`, `city_municipality`, `province`, `postal_code`, `user_type`, `is_verified`, `discount_type`, `discount_document_path`, `discount_document_name`, `drivers_license_path`, `drivers_license_name`, `drivers_license_verified`, `discount_verified`, `created_at`, `updated_at`, `license_status`, `shift_status`, `last_active`) VALUES
(1, 'chrismrown', 'cmrown@gmail.com', '$2y$10$plRbr4UT1pi7z.h.fiWPCuWNJOs8ACqMimk/wkn5GAT/SwAgrGhMC', 'Chris', 'Mrown', '09987654321', '2002-11-23', 'Male', 'Blk 7A Lot 41', 'Summerfield Subdivision', 'Osorio', 'Trece Martires', 'Cavite', '4109', 'driver', 0, NULL, NULL, NULL, NULL, NULL, 0, 0, '2025-09-08 02:20:07', '2025-09-08 02:20:07', 'pending', 'off_shift', NULL),
(2, 'driver1', 'juan.delacruz@lakbai.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Juan', 'Dela Cruz', '09123456789', '1990-01-15', 'Male', '123', 'Main Street', 'Barangay 1', 'Cebu City', 'Cebu', '6000', 'driver', 1, NULL, NULL, NULL, NULL, 'D123-456-789', 0, 0, '2025-09-08 02:24:28', '2025-09-08 02:24:28', '', '', NULL),
(3, 'driver3', 'pedro.garcia@lakbai.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Pedro', 'Garcia', '09171234567', '1988-12-10', 'Male', '789', 'Pine Street', 'Barangay 3', 'Cebu City', 'Cebu', '6000', 'driver', 1, NULL, NULL, NULL, NULL, 'D555-666-777', 0, 0, '2025-09-08 02:24:28', '2025-09-08 02:24:28', '', '', NULL),
(5, 'Matsu', 'delcarmenjl@students.nu-dasma.edu.ph', '$2y$10$D3rDtuaPGvHHOZpkiso3G.koUQFkjKvOsVWih/QFlTv3mP8oztO7O', 'Jiro', 'Del Carmen', '09943449246', '2004-11-23', 'Male', 'Blk 7A Lot 41', 'Summerfield Subdivision', 'Osorio', 'Trece Martires City', 'Cavite', '4109', 'passenger', 0, 'Student', NULL, NULL, NULL, NULL, 0, 0, '2025-09-08 02:56:20', '2025-09-08 02:56:20', 'pending', 'off_shift', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `drivers`
--
ALTER TABLE `drivers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `license_number` (`license_number`);

--
-- Indexes for table `jeepneys`
--
ALTER TABLE `jeepneys`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `jeepney_number` (`jeepney_number`),
  ADD UNIQUE KEY `plate_number` (`plate_number`),
  ADD KEY `fk_route` (`route_id`),
  ADD KEY `fk_driver` (`driver_id`);

--
-- Indexes for table `routes`
--
ALTER TABLE `routes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `route_name` (`route_name`),
  ADD UNIQUE KEY `uk_route_name` (`route_name`),
  ADD KEY `idx_origin` (`origin`),
  ADD KEY `idx_destination` (`destination`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone_number` (`phone_number`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_phone` (`phone_number`),
  ADD KEY `idx_user_type` (`user_type`),
  ADD KEY `idx_discount_type` (`discount_type`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_drivers_license_verified` (`drivers_license_verified`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `drivers`
--
ALTER TABLE `drivers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jeepneys`
--
ALTER TABLE `jeepneys`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `routes`
--
ALTER TABLE `routes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `jeepneys`
--
ALTER TABLE `jeepneys`
  ADD CONSTRAINT `fk_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`),
  ADD CONSTRAINT `fk_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
