<?php
// Auth0 Sync Configuration

// Load environment variables
require_once __DIR__ . '/../vendor/autoload.php';
if (file_exists(__DIR__ . '/../.env')) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
    $dotenv->load();
}

// Backend API Token for Auth0 Actions
define('BACKEND_API_TOKEN', $_ENV['BACKEND_API_TOKEN'] ?? 'NYDdY3H1YuNB+yIkkSF9om8Eb1fT/ykDhFwYsucd19A=');

// Backend API URL (update this for your environment)
define('BACKEND_API_URL', $_ENV['APP_URL'] ?? 'http://localhost/LakbAI/LakbAI-API');

// CORS Settings
define('CORS_ORIGIN', $_ENV['CORS_ORIGIN'] ?? '*');

// Auth0 Domain (for verification)
define('AUTH0_DOMAIN', $_ENV['AUTH0_DOMAIN'] ?? 'dev-0aaa1azz6qjnlz2l.us.auth0.com');

// Auth0 Client ID (for verification)
define('AUTH0_CLIENT_ID', $_ENV['AUTH0_CLIENT_ID'] ?? 'oRukVKxyipmWOeKTcP05u3MshZpk66f5');

// Auth0 Client Secret
define('AUTH0_CLIENT_SECRET', $_ENV['AUTH0_CLIENT_SECRET'] ?? '');

// Auth0 Audience
define('AUTH0_AUDIENCE', $_ENV['AUTH0_AUDIENCE'] ?? 'https://dev-0aaa1azz6qjnlz2l.us.auth0.com/api/v2/');