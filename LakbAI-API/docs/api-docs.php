<?php
/**
 * @OA\Info(
 *     title="LakbAI API",
 *     version="1.0.0",
 *     description="Smart jeepney tracking and fare management system API",
 *     @OA\Contact(
 *         email="livadomc@gmail.com",
 *         name="Mark Joseph Livado"
 *     ),
 *     @OA\License(
 *         name="MIT",
 *         url="https://opensource.org/licenses/MIT"
 *     )
 * )
 *
 * @OA\Server(
 *     url="http://localhost/LakbAI/LakbAI-API/routes/api.php",
 *     description="Local Development Server"
 * )
 *
 * @OA\Server(
 *     url="https://your-production-domain.com/LakbAI/LakbAI-API/routes/api.php",
 *     description="Production Server"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="bearerAuth",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT",
 *     description="JWT Authorization header using the Bearer scheme"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="auth0Token",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="JWT",
 *     description="Auth0 JWT token"
 * )
 *
 * @OA\Tag(
 *     name="Authentication",
 *     description="User authentication and authorization endpoints"
 * )
 *
 * @OA\Tag(
 *     name="Users",
 *     description="User management operations"
 * )
 *
 * @OA\Tag(
 *     name="Jeepneys",
 *     description="Jeepney fleet management"
 * )
 *
 * @OA\Tag(
 *     name="Routes",
 *     description="Route and checkpoint management"
 * )
 *
 * @OA\Tag(
 *     name="Earnings",
 *     description="Driver earnings and payment tracking"
 * )
 *
 * @OA\Tag(
 *     name="Payments",
 *     description="Payment processing with Xendit integration"
 * )
 *
 * @OA\Tag(
 *     name="Admin",
 *     description="Administrative operations"
 * )
 *
 * @OA\Tag(
 *     name="Mobile",
 *     description="Mobile app specific endpoints"
 * )
 */

// Common response schemas

/**
 * @OA\Schema(
 *     schema="ApiResponse",
 *     @OA\Property(property="status", type="string", enum={"success", "error"}),
 *     @OA\Property(property="message", type="string"),
 *     @OA\Property(property="data", type="object")
 * )
 */

/**
 * @OA\Schema(
 *     schema="ErrorResponse",
 *     @OA\Property(property="status", type="string", example="error"),
 *     @OA\Property(property="message", type="string"),
 *     @OA\Property(property="error_code", type="string", nullable=true)
 * )
 */

/**
 * @OA\Schema(
 *     schema="User",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="auth0_id", type="string", nullable=true),
 *     @OA\Property(property="email", type="string", format="email"),
 *     @OA\Property(property="first_name", type="string"),
 *     @OA\Property(property="last_name", type="string"),
 *     @OA\Property(property="phone", type="string", nullable=true),
 *     @OA\Property(property="user_type", type="string", enum={"passenger", "driver", "admin"}),
 *     @OA\Property(property="profile_completed", type="boolean"),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */

/**
 * @OA\Schema(
 *     schema="Jeepney",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="jeepney_number", type="string"),
 *     @OA\Property(property="plate_number", type="string"),
 *     @OA\Property(property="route_id", type="integer", nullable=true),
 *     @OA\Property(property="driver_id", type="integer", nullable=true),
 *     @OA\Property(property="capacity", type="integer"),
 *     @OA\Property(property="status", type="string", enum={"active", "inactive", "maintenance"}),
 *     @OA\Property(property="created_at", type="string", format="date-time"),
 *     @OA\Property(property="updated_at", type="string", format="date-time")
 * )
 */

/**
 * @OA\Schema(
 *     schema="Route",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="route_name", type="string"),
 *     @OA\Property(property="start_location", type="string"),
 *     @OA\Property(property="end_location", type="string"),
 *     @OA\Property(property="distance", type="number", format="float"),
 *     @OA\Property(property="estimated_time", type="integer"),
 *     @OA\Property(property="base_fare", type="number", format="float"),
 *     @OA\Property(property="status", type="string", enum={"active", "inactive"}),
 *     @OA\Property(property="created_at", type="string", format="date-time")
 * )
 */

/**
 * @OA\Schema(
 *     schema="Earnings",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="driver_id", type="integer"),
 *     @OA\Property(property="trip_id", type="string"),
 *     @OA\Property(property="passenger_id", type="string"),
 *     @OA\Property(property="original_fare", type="number", format="float"),
 *     @OA\Property(property="final_fare", type="number", format="float"),
 *     @OA\Property(property="discount_amount", type="number", format="float"),
 *     @OA\Property(property="amount_paid", type="number", format="float"),
 *     @OA\Property(property="payment_method", type="string", enum={"xendit", "cash", "other"}),
 *     @OA\Property(property="pickup_location", type="string"),
 *     @OA\Property(property="destination", type="string"),
 *     @OA\Property(property="trip_date", type="string", format="date"),
 *     @OA\Property(property="created_at", type="string", format="date-time")
 * )
 */

/**
 * @OA\Schema(
 *     schema="XenditInvoice",
 *     @OA\Property(property="id", type="string"),
 *     @OA\Property(property="external_id", type="string"),
 *     @OA\Property(property="amount", type="number", format="float"),
 *     @OA\Property(property="description", type="string"),
 *     @OA\Property(property="invoice_url", type="string", format="url"),
 *     @OA\Property(property="status", type="string", enum={"PENDING", "PAID", "EXPIRED", "FAILED"}),
 *     @OA\Property(property="created", type="string", format="date-time"),
 *     @OA\Property(property="expiry_date", type="string", format="date-time")
 * )
 */
?>
