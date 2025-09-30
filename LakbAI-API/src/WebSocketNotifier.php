<?php

namespace Joseph\LakbAiApi;

/**
 * WebSocket Notifier
 * 
 * Sends real-time notifications to the WebSocket server
 * for immediate delivery to connected clients
 */
class WebSocketNotifier
{
    private $webSocketUrl;
    private $enabled;

    public function __construct()
    {
        // Get WebSocket server URL from environment or use default
        $this->webSocketUrl = $_ENV['WEBSOCKET_URL'] ?? 'http://localhost:8080';
        $this->enabled = $_ENV['WEBSOCKET_ENABLED'] ?? true;
    }

    /**
     * Send driver location update notification
     */
    public function notifyDriverLocationUpdate($driverId, $routeId, $location, $coordinates = null, $jeepneyNumber = null, $isOrigin = false, $isEndpoint = false, $driverName = null)
    {
        if (!$this->enabled) {
            return false;
        }

        $data = [
            'driverId' => $driverId,
            'routeId' => $routeId,
            'location' => $location,
            'coordinates' => $coordinates,
            'jeepneyNumber' => $jeepneyNumber,
            'driverName' => $driverName,
            'is_origin' => $isOrigin,
            'is_endpoint' => $isEndpoint,
            'notification_priority' => $isOrigin ? 'high' : 'normal',
            'timestamp' => date('c')
        ];

        return $this->sendNotification('/api/driver-location', $data);
    }

    /**
     * Send trip completion notification
     */
    public function notifyTripCompleted($tripId, $driverId, $routeId, $passengerId = null, $earnings = null)
    {
        if (!$this->enabled) {
            return false;
        }

        $data = [
            'tripId' => $tripId,
            'driverId' => $driverId,
            'routeId' => $routeId,
            'passengerId' => $passengerId,
            'earnings' => $earnings,
            'timestamp' => date('c')
        ];

        return $this->sendNotification('/api/trip-completed', $data);
    }

    /**
     * Send QR scan notification
     */
    public function notifyQRScan($driverId, $passengerId, $amount, $checkpoint, $tripId = null)
    {
        if (!$this->enabled) {
            return false;
        }

        $data = [
            'driverId' => $driverId,
            'passengerId' => $passengerId,
            'amount' => $amount,
            'checkpoint' => $checkpoint,
            'tripId' => $tripId,
            'timestamp' => date('c')
        ];

        return $this->sendNotification('/api/qr-scan', $data);
    }

    /**
     * Send earnings update notification
     */
    public function notifyEarningsUpdate($driverId, $amount, $totalEarnings, $tripCount = null)
    {
        if (!$this->enabled) {
            return false;
        }

        $data = [
            'driverId' => $driverId,
            'amount' => $amount,
            'totalEarnings' => $totalEarnings,
            'tripCount' => $tripCount,
            'timestamp' => date('c')
        ];

        return $this->sendNotification('/api/earnings-update', $data);
    }

    /**
     * Send route status update notification
     */
    public function notifyRouteStatusUpdate($routeId, $status, $availableDrivers = null)
    {
        if (!$this->enabled) {
            return false;
        }

        $data = [
            'routeId' => $routeId,
            'status' => $status, // 'active', 'busy', 'inactive'
            'availableDrivers' => $availableDrivers,
            'timestamp' => date('c')
        ];

        return $this->sendNotification('/api/route-status', $data);
    }

    /**
     * Send generic notification to specific user
     */
    public function notifyUser($userId, $userType, $title, $message, $data = null)
    {
        if (!$this->enabled) {
            return false;
        }

        $notificationData = [
            'userId' => $userId,
            'userType' => $userType,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('c')
        ];

        return $this->sendNotification('/api/user-notification', $notificationData);
    }

    /**
     * Send HTTP request to WebSocket server
     */
    private function sendNotification($endpoint, $data)
    {
        try {
            $url = $this->webSocketUrl . $endpoint;
            $jsonData = json_encode($data);

            // Initialize cURL
            $ch = curl_init();
            
            // Set cURL options
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $jsonData,
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'Content-Length: ' . strlen($jsonData)
                ],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 5, // 5 second timeout
                CURLOPT_CONNECTTIMEOUT => 3, // 3 second connection timeout
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_SSL_VERIFYPEER => false, // For development
                CURLOPT_USERAGENT => 'LakbAI-API/1.0'
            ]);

            // Execute request
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            
            curl_close($ch);

            // Check for cURL errors
            if ($error) {
                error_log("WebSocket notification cURL error: " . $error);
                return false;
            }

            // Check HTTP response code
            if ($httpCode >= 200 && $httpCode < 300) {
                error_log("WebSocket notification sent successfully: " . $endpoint);
                return true;
            } else {
                error_log("WebSocket notification failed: HTTP $httpCode - " . $response);
                return false;
            }

        } catch (Exception $e) {
            error_log("WebSocket notification exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Test WebSocket server connection
     */
    public function testConnection()
    {
        try {
            $url = $this->webSocketUrl . '/health';
            
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 5,
                CURLOPT_CONNECTTIMEOUT => 3,
                CURLOPT_NOBODY => true, // HEAD request
                CURLOPT_HEADER => true
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            
            curl_close($ch);

            if ($error) {
                return [
                    'status' => 'error',
                    'message' => 'Connection failed: ' . $error,
                    'url' => $url
                ];
            }

            if ($httpCode === 200) {
                return [
                    'status' => 'success',
                    'message' => 'WebSocket server is reachable',
                    'url' => $url,
                    'httpCode' => $httpCode
                ];
            } else {
                return [
                    'status' => 'error',
                    'message' => 'HTTP error: ' . $httpCode,
                    'url' => $url,
                    'httpCode' => $httpCode
                ];
            }

        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Exception: ' . $e->getMessage(),
                'url' => $url ?? 'unknown'
            ];
        }
    }

    /**
     * Enable or disable WebSocket notifications
     */
    public function setEnabled($enabled)
    {
        $this->enabled = $enabled;
    }

    /**
     * Check if WebSocket notifications are enabled
     */
    public function isEnabled()
    {
        return $this->enabled;
    }

    /**
     * Get WebSocket server URL
     */
    public function getWebSocketUrl()
    {
        return $this->webSocketUrl;
    }
}
