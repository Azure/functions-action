export class Sleeper {
    public static timeout(ms: number) {
        return new Promise(res => setTimeout(res, ms));
    }
}