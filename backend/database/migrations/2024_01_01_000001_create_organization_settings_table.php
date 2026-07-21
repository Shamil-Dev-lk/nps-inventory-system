<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organization_settings', function (Blueprint $table) {
            $table->id();
            $table->string('name_en')->default('Nikaweratiya Pradeshiya Sabha');
            $table->string('name_si')->nullable();
            $table->string('name_ta')->nullable();
            $table->string('short_name')->default('NPS');
            $table->string('district')->default('Kurunegala');
            $table->string('province')->default('North Western');
            $table->text('address')->nullable();
            $table->string('telephone')->nullable();
            $table->string('fax')->nullable();
            $table->string('mobile')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->string('gps_latitude')->nullable();
            $table->string('gps_longitude')->nullable();
            $table->string('chairman_name')->nullable();
            $table->string('secretary_name')->nullable();
            $table->string('working_hours_start')->default('08:00');
            $table->string('working_hours_end')->default('17:00');
            $table->string('official_logo')->nullable();
            $table->string('government_logo')->nullable();
            $table->string('favicon')->nullable();
            $table->string('login_background')->nullable();
            $table->string('dashboard_background')->nullable();
            $table->string('primary_color')->default('#006838');
            $table->string('secondary_color')->default('#8DC63F');
            $table->string('accent_color')->default('#FDB913');
            $table->string('footer_text')->nullable();
            $table->string('copyright')->nullable();
            $table->string('system_name')->default('ANTIGRAVITY');
            $table->string('system_subtitle')->nullable();
            $table->string('currency')->default('LKR');
            $table->string('currency_symbol')->default('Rs.');
            $table->string('date_format')->default('d/m/Y');
            $table->string('timezone')->default('Asia/Colombo');
            $table->string('default_language')->default('en');
            $table->boolean('enable_sms')->default(false);
            $table->boolean('enable_email_notifications')->default(true);
            $table->boolean('enable_push_notifications')->default(false);
            $table->boolean('enable_ai_features')->default(false);
            $table->text('openai_api_key')->nullable();
            $table->string('sms_provider')->nullable();
            $table->text('sms_api_key')->nullable();
            $table->string('smtp_host')->nullable();
            $table->integer('smtp_port')->nullable();
            $table->string('smtp_username')->nullable();
            $table->text('smtp_password')->nullable();
            $table->string('smtp_encryption')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_settings');
    }
};
