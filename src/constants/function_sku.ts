import { UnexpectedConversion } from "../exceptions";

export enum FunctionSkuConstant {
    Consumption = 1,
    Dedicated,
    ElasticPremium
}

export class FunctionSkuUtil {
    public static FromString(sku: string) : FunctionSkuConstant {
        const skuLowercasedString: string = sku.trim().toLowerCase();
        if (skuLowercasedString.startsWith('dynamic')) {
            return FunctionSkuConstant.Consumption;
        }
        if (skuLowercasedString.startsWith('elasticpremium')) {
            return FunctionSkuConstant.ElasticPremium;
        }
        return FunctionSkuConstant.Dedicated;
    }
}