<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('stock_issues', function (Blueprint $table) {
            $table->unsignedBigInteger('customer_id')->nullable()->after('project_id');
        });

        // Modify the enum to include 'customer'
        DB::statement("ALTER TABLE stock_issues MODIFY COLUMN issue_to_type ENUM('department', 'officer', 'project', 'customer') DEFAULT 'department'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert the enum
        DB::statement("ALTER TABLE stock_issues MODIFY COLUMN issue_to_type ENUM('department', 'officer', 'project') DEFAULT 'department'");

        Schema::table('stock_issues', function (Blueprint $table) {
            $table->dropColumn('customer_id');
        });
    }
};
