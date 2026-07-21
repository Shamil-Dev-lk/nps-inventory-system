<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('asset_code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status')->default('active');
            $table->decimal('purchase_cost', 12, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void { Schema::dropIfExists('assets'); }
};
