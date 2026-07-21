<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->index('is_active');
            $table->index('current_quantity');
            $table->index('reorder_level');
            $table->index('category_id');
            $table->index('warehouse_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropIndex(['is_active']);
            $table->dropIndex(['current_quantity']);
            $table->dropIndex(['reorder_level']);
            $table->dropIndex(['category_id']);
            $table->dropIndex(['warehouse_id']);
        });
    }
};
