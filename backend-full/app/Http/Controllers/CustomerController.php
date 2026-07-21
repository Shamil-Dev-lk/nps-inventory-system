<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query();

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->latest()->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:customers,name'],
            'email' => ['nullable', 'email', 'max:255', 'unique:customers,email'],
            'phone' => ['nullable', 'string', 'max:50', 'unique:customers,phone'],
            'nic' => ['nullable', 'string', 'max:100'],
            'designation' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string']
        ]);

        $customer = Customer::create($validated);

        return response()->json([
            'status' => 'success',
            'data' => $customer
        ], 201);
    }

    public function show(Customer $customer)
    {
        return response()->json([
            'status' => 'success',
            'data' => $customer
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('customers')->ignore($customer->id)],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('customers')->ignore($customer->id)],
            'phone' => ['nullable', 'string', 'max:50', Rule::unique('customers')->ignore($customer->id)],
            'nic' => ['nullable', 'string', 'max:100'],
            'designation' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string']
        ]);

        $customer->update($validated);

        return response()->json([
            'status' => 'success',
            'data' => $customer
        ]);
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();
        return response()->json([
            'status' => 'success',
            'message' => 'Customer deleted successfully'
        ]);
    }
}
