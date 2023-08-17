import { AccountEntity } from "../entities/AccountEntity";
import { IdTokenEntity } from "../entities/IdTokenEntity";
import { AccessTokenEntity } from "../entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../entities/RefreshTokenEntity";
import { AppMetadataEntity } from "../entities/AppMetadataEntity";
import { ServerTelemetryEntity } from "../entities/ServerTelemetryEntity";
import { ThrottlingEntity } from "../entities/ThrottlingEntity";
import { AuthorityMetadataEntity } from "../entities/AuthorityMetadataEntity";
import { AuthenticationScheme } from "../../utils/Constants";
import { ScopeSet } from "../../request/ScopeSet";
export declare type AccountCache = Record<string, AccountEntity>;
export declare type IdTokenCache = Record<string, IdTokenEntity>;
export declare type AccessTokenCache = Record<string, AccessTokenEntity>;
export declare type RefreshTokenCache = Record<string, RefreshTokenEntity>;
export declare type AppMetadataCache = Record<string, AppMetadataEntity>;
/**
 * Object type of all accepted cache types
 */
export declare type ValidCacheType = AccountEntity | IdTokenEntity | AccessTokenEntity | RefreshTokenEntity | AppMetadataEntity | AuthorityMetadataEntity | ServerTelemetryEntity | ThrottlingEntity | string;
/**
 * Object type of all credential types
 */
export declare type ValidCredentialType = IdTokenEntity | AccessTokenEntity | RefreshTokenEntity;
/**
 * Account:	<home_account_id>-<environment>-<realm*>
 */
export declare type AccountFilter = {
    homeAccountId?: string;
    localAccountId?: string;
    username?: string;
    environment?: string;
    realm?: string;
    nativeAccountId?: string;
};
/**
 * Credential: <home_account_id*>-<environment>-<credential_type>-<client_id>-<realm*>-<target*>-<scheme*>
 */
export declare type CredentialFilter = {
    homeAccountId?: string;
    environment?: string;
    credentialType?: string;
    clientId?: string;
    familyId?: string;
    realm?: string;
    target?: ScopeSet;
    userAssertionHash?: string;
    tokenType?: AuthenticationScheme;
    keyId?: string;
    requestedClaimsHash?: string;
};
/**
 * AppMetadata: appmetadata-<environment>-<client_id>
 */
export declare type AppMetadataFilter = {
    environment?: string;
    clientId?: string;
};
export declare type TokenKeys = {
    idToken: string[];
    accessToken: string[];
    refreshToken: string[];
};
//# sourceMappingURL=CacheTypes.d.ts.map