<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name_en');
            $table->string('name_si')->nullable();
            $table->string('name_ta')->nullable();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->string('color')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('parent_id')->references('id')->on('item_categories')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_categories');
    }
};
