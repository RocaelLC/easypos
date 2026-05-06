import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function readEnv(name: string) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env: ${name}`);
    return v;
}

export function getAdminAuth() {
    if (!getApps().length) {
        initializeApp({
            credential: cert({
                projectId: "easypos-c8e8f",
                privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDWUSBdfGFWMpI/\nK0/OOpO8sgGyz1yjyIp6hsrN6DFxI/vHfLKumRKZ0pnqccolT9rzbtNzRmvlnw3C\nt7JcF+u4/izbX6peHAg9Z8STPcb+2JD544JfbYCuflCIJGWFcOLCThbcJ0laRawP\nZGox3sfYtrPFENTx718grs5ckfPxBlke1FGJxIw7ZyOGOxlWjpYzmgc9lHELVmuv\nmBfnLI7aXHkK5QVUXcBgeB+ykxw4F8zTVhA6Ld2ANc6cPs+nJITB0mMaoVwt9+KH\n9nsrGgyvgugpCAEaUUzyvxn7/CfCWVVP2GTKnRtqSY/X4bD+328h/lbG0c5N+pqY\nF2RHgkXXAgMBAAECggEAILimLl/NJLH37jkYqC39XHP5GmnahQ8bRXXLBQEMe2+5\nA04godOxKVckNM1GxceZcE1db14zHw3XtgEB9FmandYA10WV52R0RZvQQYLPHR3H\nlL+NqjA302xpsz+LWIJRvMTbbKV655N3n6n/JLoU3RuX+uCFAqM/bOgDjdKi4guE\nfwSuwYKIRXl7YeObHfMQLBRaSh8s0YaMWatusodj74LtzX4gzpwQg/ow6B5UkGzs\nTThBKCSkeT+ugmCRUPWDCATHX9q/6MIXwAM3TdkcvsUQOkN0dAnzVTG2/GxVjX3q\nNnvdEK8pPTuUjO+uLI1QjQVW5ke+ylVrmovldIPbwQKBgQDzs+CrfAnTt+tyv3nW\nHp4faN39eOJrMo0cJnHbFhmNlbCZCojDJuE8iKSRg/W3rD/kymfaeUgsqK4qAtPp\nRakJ6K9xO6vuA6vlDG4J18gQorBXSrpOtAp0ANDN5cZ+LiVrPMfpRPxqooki2Q6N\nfzkls69dVKQ3eOfK0uEGzwBO8QKBgQDhIaWsI0o0fyPcshvBXLm1s3BmhrEg//J0\nN/MB+RYdSTQN1pumTBA2RPPSE2mKcYEayop4rDrfND6hbN9rlipgdPOuDi9PER8a\nCEZmjX01G1wIQ3ksJOxYU8p5Xjji/s1T1MoVyI0lVXg7PuIAInu8p9NZ9gZdubFI\n1ngeHNRxRwKBgB4RdYjy9utuZ9hyk3+9q1jIwYsCnT0IsaxleerEIUb8zxsy14js\nhSHI4jUqCOkukXuTFZk5GZSZA1QfoTHI7IBSe0MHT8FAJrdN/02rl/2ldQhwKeiI\nAjop15lv3ju3SdqfVzMK1fH6N91a1pbSuaRTNTHYvaIygrbdqfIDHFChAoGAEyaw\nmDccTeDu5QxFrio8JgfQrPgSQ1NihZ5ozqcoyW77vZ2e+gOIcYVmFF3QYZWMPQIz\ny1YjX+9q0IKZcuaATlpEjG7qeVhkg+tmSb0JhKYCKzXKLgYqEM138OEiB7VTNClq\n03WPBDkEFE4iHY7RZdgE86cpHXn5ac/MwgsDy2sCgYEA0d1igJCuSS7PwGYP90nK\n9ijUUdiR7a7N4yibKAZM1+z7W440Gqh+D+8FbnDFkmarp0H0RkQF6/vWZXU9J8Os\n5+7KpbMrmYxGkcIvbswu4WQE0DPk0iCYSiQI6eNwvIHp3FN7rIDnBFafcU2tvj8f\npJasRodsTfZmRMrN/GgvxYs=\n-----END PRIVATE KEY-----\n",
                clientEmail: "firebase-adminsdk-fbsvc@easypos-c8e8f.iam.gserviceaccount.com",
            }),
        });
    }
    return getAuth();
}
