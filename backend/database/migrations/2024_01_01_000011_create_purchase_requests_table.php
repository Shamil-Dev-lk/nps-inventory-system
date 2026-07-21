<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->id();
            $table->string('pr_number')->unique();
            $table->unsignedBigInteger('department_id')->nullable();
            $table->unsignedBigInteger('project_id')->nullable();
            $table->unsignedBigInteger('requested_by');
            $table->date('required_date')->nullable();
            $table->text('purpose')->nullable();
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->enum('status', ['draft', 'submitted', 'approved', 'rejected', 'ordered', 'completed', 'cancelled'])->default('draft');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_remarks')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('set null');
        });

        Schema::create('purchase_request_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('purchase_request_id');
            $table->unsignedBigInteger('item_id');
            $table->decimal('quantity', 15, 3);
            $table->decimal('estimated_unit_price', 15, 2)->default(0);
            $table->string('specification')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->foreign('purchase_request_id')->references('id')->on('purchase_requests')->onDelete('cascade');
            $table->foreign('item_id')->references('id')->on('items');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_request_items');
        Schema::dropIfExists('purchase_requests');
    }
};
