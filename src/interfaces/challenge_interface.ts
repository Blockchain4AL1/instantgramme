export interface IChallenge {
    title: string;
    description: string;
    resultat_attendu:string;
}

export interface IChallengeResult {
    challenge_id: string;
    user_id:string;
    resultat_obtenu:string;
    temps_execution:number;
    used_language:string;
}

export interface IUidChallenge {
    challenge_id: string;
  }