export interface WalletState {
  balance: number;
}

const STORAGE_KEY = 'city_world_wallet_infinite_v2';
const INITIAL_BALANCE = 999999999; // $999,999,999 Infinite testing funds

export class EconomyManager {
  private balance: number;
  private onBalanceChangeCallbacks: Array<(newBalance: number) => void> = [];

  constructor() {
    this.balance = this.loadBalance();
    this.updateDom();
  }

  private loadBalance(): number {
    try {
      if (typeof localStorage !== 'undefined') {
        // Wipe old depleted v1 balance so user gets instant infinite funds
        localStorage.removeItem('city_world_wallet_v1');
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = parseInt(raw, 10);
          if (!isNaN(parsed) && parsed >= 100000) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('[EconomyManager] Could not read wallet from storage:', e);
    }
    return INITIAL_BALANCE;
  }

  private saveBalance(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, this.balance.toString());
      }
    } catch (e) {
      console.warn('[EconomyManager] Could not save wallet to storage:', e);
    }
  }

  public getBalance(): number {
    return this.balance;
  }

  public canAfford(_amount: number): boolean {
    // Infinite funds: user can always test, remodel, and construct without limits
    return true;
  }

  public deduct(amount: number): boolean {
    if (amount > 0) {
      this.balance = Math.max(0, this.balance - amount);
      this.saveBalance();
      this.updateDom();
      this.notify();
    }
    return true;
  }

  public add(amount: number): void {
    if (amount <= 0) return;
    this.balance += amount;
    this.saveBalance();
    this.updateDom();
    this.notify();
  }

  public setBalance(amount: number): void {
    this.balance = Math.max(0, amount);
    this.saveBalance();
    this.updateDom();
    this.notify();
  }

  public onBalanceChange(cb: (newBalance: number) => void): void {
    this.onBalanceChangeCallbacks.push(cb);
  }

  private notify(): void {
    this.onBalanceChangeCallbacks.forEach((cb) => cb(this.balance));
  }

  public updateDom(): void {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('player-balance-text');
    if (el) {
      el.textContent = '$∞ Ilimitado';
    }
  }
}

