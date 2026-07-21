<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('project_code')->unique();
            $table->string('name_en');
            $table->string('name_si')->nullable();
            $table->string('name_ta')->nullable();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('department_id')->nullable();
            $table->unsignedBigInteger('project_manager_id')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->decimal('budget', 15, 2)->default(0);
            $table->enum('status', ['planning', 'active', 'on_hold', 'completed', 'cancelled'])->default('planning');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
