/**
 * Client Assertion credential for Confidential Clients
 */
export type ClientAssertion = {
    assertion: string;
    assertionType: string;
};
/**
 * Client Credentials set for Confidential Clients
 */
export type ClientCredentials = {
    clientSecret?: string;
    clientAssertion?: ClientAssertion;
};
//# sourceMappingURL=ClientCredentials.d.ts.map