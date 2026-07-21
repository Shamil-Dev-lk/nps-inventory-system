<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('supplier_code')->unique();
            $table->string('company_name');
            $table->string('contact_person')->nullable();
            $table->text('address')->nullable();
            $table->string('district')->nullable();
            $table->string('province')->nullable();
            $table->string('telephone')->nullable();
            $table->string('mobile')->nullable();
            $table->string('email')->nullable();
            $table->string('fax')->nullable();
            $table->string('website')->nullable();
            $table->string('vat_number')->nullable();
            $table->string('br_number')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_branch')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('bank_account_name')->nullable();
            $table->text('remarks')->nullable();
            $table->enum('status', ['active', 'inactive', 'blacklisted'])->default('active');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
