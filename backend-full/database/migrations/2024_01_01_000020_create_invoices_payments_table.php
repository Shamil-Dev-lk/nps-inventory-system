<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->string('supplier_invoice_number')->nullable();
            $table->unsignedBigInteger('supplier_id');
            $table->unsignedBigInteger('grn_id')->nullable();
            $table->date('invoice_date');
            $table->date('due_date')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('balance_amount', 15, 2)->default(0);
            $table->enum('status', ['unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled'])->default('unpaid');
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('supplier_id')->references('id')->on('suppliers');
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_number')->unique();
            $table->unsignedBigInteger('supplier_invoice_id');
            $table->unsignedBigInteger('supplier_id');
            $table->date('payment_date');
            $table->decimal('amount', 15, 2);
            $table->enum('payment_method', ['cash', 'cheque', 'bank_transfer', 'online'])->default('cash');
            $table->string('reference_number')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('cheque_number')->nullable();
            $table->unsignedBigInteger('paid_by');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('supplier_invoice_id')->references('id')->on('supplier_invoices');
            $table->foreign('supplier_id')->references('id')->on('suppliers');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('supplier_invoices');
    }
};
