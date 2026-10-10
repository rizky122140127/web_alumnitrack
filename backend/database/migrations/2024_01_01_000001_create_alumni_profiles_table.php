<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alumni_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('nisn', 10)->unique();
            $table->year('graduation_year');
            $table->enum('current_status', [
                'mahasiswa', 'gap_year', 'bekerja', 'wirausaha', 'belum_kerja'
            ])->default('belum_kerja');
            $table->string('campus_name')->nullable();
            $table->string('major_name')->nullable();
            $table->string('company_name')->nullable();
            $table->string('job_title')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alumni_profiles');
    }
};
