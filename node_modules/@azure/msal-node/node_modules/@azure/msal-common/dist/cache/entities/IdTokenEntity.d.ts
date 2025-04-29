import { CredentialEntity } from "./CredentialEntity";
/**
 * Id Token Cache Type
 */
export type IdTokenEntity = CredentialEntity & {
    /**  Full tenant or organizational identifier that the account belongs to */
    realm: string;
};
//# sourceMappingURL=IdTokenEntity.d.ts.map