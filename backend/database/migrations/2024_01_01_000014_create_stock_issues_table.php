<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_issues', function (Blueprint $table) {
            $table->id();
            $table->string('issue_number')->unique();
            $table->enum('issue_to_type', ['department', 'officer', 'project'])->default('department');
            $table->unsignedBigInteger('department_id')->nullable();
            $table->unsignedBigInteger('officer_id')->nullable();
            $table->unsignedBigInteger('project_id')->nullable();
            $table->unsignedBigInteger('warehouse_id');
            $table->date('issue_date');
            $table->unsignedBigInteger('issued_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->string('purpose')->nullable();
            $table->string('recipient_signature')->nullable();
            $table->enum('status', ['draft', 'approved', 'rejected', 'issued'])->default('draft');
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('warehouse_id')->references('id')->on('warehouses');
        });

        Schema::create('stock_issue_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('stock_issue_id');
            $table->unsignedBigInteger('item_id');
            $table->decimal('quantity', 15, 3);
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('total_price', 15, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->foreign('stock_issue_id')->references('id')->on('stock_issues')->onDelete('cascade');
            $table->foreign('item_id')->references('id')->on('items');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_issue_items');
        Schema::dropIfExists('stock_issues');
    }
};
