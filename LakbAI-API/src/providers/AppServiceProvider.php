<?php

require_once __DIR__ . '/ServiceContainer.php';
require_once __DIR__ . '/AuthServiceProvider.php';

class AppServiceProvider {
    private $container;
    private $dbConnection;
    private $pdoConnection;

    public function __construct($dbConnection) {
        $this->container = new ServiceContainer();
        $this->dbConnection = $dbConnection;
        
        // Get PDO connection from global scope
        global $pdo;
        $this->pdoConnection = $pdo;
        
        $this->registerServices();
    }

    /**
     * Register all application services
     */
    private function registerServices() {
        // Register mysqli database connection (for backward compatibility)
        $this->container->register('Database', function($container) {
            return $this->dbConnection;
        });
        
        // Register PDO database connection (for new Driver CRUD)
        $this->container->register('PDO', function($container) {
            return $this->pdoConnection;
        });

        // Register auth services
        AuthServiceProvider::register($this->container, $this->dbConnection);

        // Boot services
        AuthServiceProvider::boot($this->container);
    }

    /**
     * Get the service container
     */
    public function getContainer() {
        return $this->container;
    }

    /**
     * Get a service from container
     */
    public function get($serviceName) {
        return $this->container->get($serviceName);
    }

    /**
     * Create request instances with proper dependencies
     */
    public function createRegisterRequest($data) {
        require_once __DIR__ . '/../requests/RegisterRequest.php';
        return new RegisterRequest($data, $this->get('ValidationHelper'));
    }

    public function createLoginRequest($data) {
        require_once __DIR__ . '/../requests/LoginRequest.php';
        return new LoginRequest($data, $this->get('ValidationHelper'));
    }
}
?>
