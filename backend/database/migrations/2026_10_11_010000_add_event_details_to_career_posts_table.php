<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('career_posts', function (Blueprint $table) {
            $table->enum('event_phase', ['upcoming', 'completed'])->nullable()->after('category');
            $table->string('event_image_path')->nullable()->after('registration_link');
        });
    }

    public function down(): void
    {
        Schema::table('career_posts', function (Blueprint $table) {
            $table->dropColumn(['event_phase', 'event_image_path']);
        });
    }
};
