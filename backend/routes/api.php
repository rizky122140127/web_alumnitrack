<?php

use App\Http\Controllers\AccreditationRekapController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AlumniController;
use App\Http\Controllers\AlumniRegistrationController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\CareerPostController;
use App\Http\Controllers\TracerAnswerController;
use App\Http\Controllers\TracerQuestionController;
use App\Http\Controllers\WaNotificationController;
use App\Http\Middleware\EnsureIsAdmin;
use App\Http\Middleware\EnsureIsPortalUser;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Alumni Tracker SMAN 1 Talang Padang
|--------------------------------------------------------------------------
*/

// ── Public (Guest) Routes ─────────────────────────────────────────────

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/google/exchange', [GoogleAuthController::class, 'exchange']);
    Route::post('/google/register', [GoogleAuthController::class, 'register']);
});
Route::get('/public/events', [CareerPostController::class, 'publicEvents']);

// ── Authenticated Routes ──────────────────────────────────────────────

Route::middleware(['auth:sanctum', EnsureIsPortalUser::class])->group(function () {

    // Auth
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Tracer Questions (read for all, CUD for admin)
    Route::get('/tracer-questions', [TracerQuestionController::class, 'index']);
    Route::get('/tracer-questions/{tracerQuestion}', [TracerQuestionController::class, 'show']);

    // Tracer Answers (Alumni)
    Route::post('/tracer-answers', [TracerAnswerController::class, 'store']);
    Route::get('/tracer-answers/my', [TracerAnswerController::class, 'myAnswers']);

    // Career Posts (read for all, CUD with approval for admin)
    Route::get('/career-posts', [CareerPostController::class, 'index']);
    Route::get('/career-posts/{careerPost}', [CareerPostController::class, 'show']);
    Route::post('/career-posts', [CareerPostController::class, 'store']);

    // ── Admin-Only Routes ─────────────────────────────────────────

    Route::middleware(EnsureIsAdmin::class)->group(function () {

        // Alumni Directory (Admin)
        Route::get('/alumni', [AlumniController::class, 'index']);
        Route::get('/alumni/{user}', [AlumniController::class, 'show']);
        Route::put('/alumni/{user}', [AlumniController::class, 'update']);
        Route::get('/admin-users', [AdminUserController::class, 'index']);
        Route::post('/admin-users', [AdminUserController::class, 'store']);
        Route::get('/alumni-registrations', [AlumniRegistrationController::class, 'index']);
        Route::patch('/alumni-registrations/{user}', [AlumniRegistrationController::class, 'update']);

        // Tracer Questions CRUD (Admin)
        Route::post('/tracer-questions', [TracerQuestionController::class, 'store']);
        Route::put('/tracer-questions/{tracerQuestion}', [TracerQuestionController::class, 'update']);
        Route::delete('/tracer-questions/{tracerQuestion}', [TracerQuestionController::class, 'destroy']);

        // Career Posts management (Admin)
        Route::put('/career-posts/{careerPost}', [CareerPostController::class, 'update']);
        Route::delete('/career-posts/{careerPost}', [CareerPostController::class, 'destroy']);

        // Accreditation Recap
        Route::get('/tracer-answers/recap', [AccreditationRekapController::class, 'index']);

        // WA Notifications
        Route::get('/wa-notifications', [WaNotificationController::class, 'index']);
        Route::get('/wa-notifications/stats', [WaNotificationController::class, 'stats']);
        Route::post('/wa-notifications/send-tracer-reminders', [WaNotificationController::class, 'sendTracerReminders']);
        Route::post('/wa-notifications/send-targeted', [WaNotificationController::class, 'sendTargetedBroadcast']);
    });
});
