<?php

require_once __DIR__ . '/ServiceContainer.php';
require_once __DIR__ . '/../repositories/UserRepository.php';
require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../helpers/ValidationHelper.php';

class AuthServiceProvider {
    
    /**
     * Register auth-related services
     */
    public static function register(ServiceContainer $container, $dbConnection) {
        
        // Register ValidationHelper
        $container->register('ValidationHelper', function($container) use ($dbConnection) {
            return new ValidationHelper($dbConnection);
        });

        // Register UserRepository
        $container->register('UserRepository', function($container) use ($dbConnection) {
            return new UserRepository($dbConnection);
        });

        // Register AuthService
        $container->register('AuthService', function($container) {
            return new AuthService(
                $container->get('UserRepository'),
                $container->get('ValidationHelper')
            );
        });
    }

    /**
     * Boot method for any initialization logic
     */
    public static function boot(ServiceContainer $container) {
        // Any initialization logic can go here
        // For example, setting up event listeners, etc.
    }
}
?>
