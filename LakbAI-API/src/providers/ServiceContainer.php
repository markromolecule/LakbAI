<?php

class ServiceContainer {
    private $services = [];
    private $instances = [];

    /**
     * Register a service
     */
    public function register($name, $factory) {
        $this->services[$name] = $factory;
    }

    /**
     * Get a service instance
     */
    public function get($name) {
        if (!isset($this->services[$name])) {
            throw new Exception("Service '{$name}' not found");
        }

        // Return singleton instance if already created
        if (isset($this->instances[$name])) {
            return $this->instances[$name];
        }

        // Create new instance
        $factory = $this->services[$name];
        $this->instances[$name] = $factory($this);

        return $this->instances[$name];
    }

    /**
     * Check if service is registered
     */
    public function has($name) {
        return isset($this->services[$name]);
    }

    /**
     * Remove a service
     */
    public function remove($name) {
        unset($this->services[$name], $this->instances[$name]);
    }

    /**
     * Get all registered service names
     */
    public function getServiceNames() {
        return array_keys($this->services);
    }
}
?>
