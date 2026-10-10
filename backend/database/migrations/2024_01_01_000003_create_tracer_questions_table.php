<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tracer_questions', function (Blueprint $table) {
            $table->id();
            $table->text('question_text');
            $table->enum('question_type', ['text', 'radio', 'checkbox', 'scale']);
            $table->json('options')->nullable();
            $table->boolean('is_required')->default(true);
            $table->integer('order_number');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tracer_questions');
    }
};
