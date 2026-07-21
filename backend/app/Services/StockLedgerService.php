<?php
namespace App\Services;
use App\Models\Item;
use App\Models\StockLedger;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
class StockLedgerService {
    public function record(Item $item, Warehouse $warehouse, string $transactionType, string $referenceNumber, string $referenceType, int $referenceId, float $quantityIn, float $quantityOut, float $unitCost, string $remarks = ""): StockLedger {
        return DB::transaction(function () use ($item, $warehouse, $transactionType, $referenceNumber, $referenceType, $referenceId, $quantityIn, $quantityOut, $unitCost, $remarks) {
            $lastEntry = StockLedger::where("item_id",$item->id)->where("warehouse_id",$warehouse->id)->latest("id")->lockForUpdate()->first();
            $balance = ($lastEntry?->balance ?? 0) + $quantityIn - $quantityOut;
            // Update item stock
            $newQty = $item->current_quantity + $quantityIn - $quantityOut;
            if ($quantityIn > 0 && $item->current_quantity >= 0) {
                $totalCost = ($item->current_quantity * $item->average_cost) + ($quantityIn * $unitCost);
                $newQty = $item->current_quantity + $quantityIn;
                $avgCost = $newQty > 0 ? $totalCost / $newQty : $unitCost;
                $item->update(["current_quantity"=>$newQty,"available_quantity"=>max(0,$newQty-$item->reserved_quantity),"average_cost"=>round($avgCost,4),"purchase_price"=>$unitCost]);
            } elseif ($quantityOut > 0) {
                $newQty = max(0, $item->current_quantity - $quantityOut);
                $item->update(["current_quantity"=>$newQty,"available_quantity"=>max(0,$newQty-$item->reserved_quantity)]);
            }
            return StockLedger::create([
                "item_id"=>$item->id,"warehouse_id"=>$warehouse->id,"transaction_type"=>$transactionType,
                "reference_number"=>$referenceNumber,"reference_type"=>$referenceType,"reference_id"=>$referenceId,
                "quantity_in"=>$quantityIn,"quantity_out"=>$quantityOut,"balance"=>$balance,
                "unit_cost"=>$unitCost,"total_value"=>($quantityIn+$quantityOut)*$unitCost,
                "transaction_date"=>now(),"created_by"=>auth()->id(),"remarks"=>$remarks,
            ]);
        });
    }
}