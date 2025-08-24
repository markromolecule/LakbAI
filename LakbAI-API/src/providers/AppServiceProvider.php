<?php

require_once __DIR__ . '/ServiceContainer.php';
require_once __DIR__ . '/AuthServiceProvider.php';

class AppServiceProvider {
    private $container;
    private $dbConnection;

    public function __construct($dbConnection) {
        $this->container = new ServiceContainer();
        $this->dbConnection = $dbConnection;
        $this->registerServices();
    }

    /**
     * Register all application services
     */
    private function registerServices() {
        // Register database connection
        $this->container->register('Database', function($container) {
            return $this->dbConnection;
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
