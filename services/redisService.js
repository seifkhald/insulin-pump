const redis = require('../redis')
const CACHE_DURATION = 300;
const BLOOD_SUGAR_EXPIRATION = 600000;
const BLOOD_SUGAR_PREFIX = 'bloodsugar:';
const TOKEN_BLACKLIST_PREFIX = 'blacklist:';

class RedisService{
    static async cachePatients(patients){
        try{
            if(redis.status !== 'ready'){
                console.log('Redis not available, skipping cache');
                return Date.now();}
                const timestamp = Date.now();
            await redis.setex('patients_cache', CACHE_DURATION, JSON.stringify({
                patients: patients,
                timestamp: timestamp
            }));
            console.log('patients cached successfully');
            return timestamp;
            }catch(error){
                console.error('Error caching patients:', error)
                return Date.now();
            }
    }

    static async getCachedPatients() {
        try {
            if (redis.status !== 'ready') {
                console.log('Redis not available, returning null');
                return null;
            }

            const data = await redis.get('patients_cache');
            if (data) {
                const parsedData = JSON.parse(data);
                return {
                    patients: parsedData.patients,
                    lastUpdate: parsedData.timestamp,
                    fromCache: true
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting cached users:', error);
            return null;
        }
    }

    static async invalidateCache() {
        try {
            if (redis.status !== 'ready') {
                console.log('Redis not available, skipping invalidation');
                return;
            }

            await redis.del('patients_cache');
            console.log('Cache invalidated successfully');
        } catch (error) {
            console.error('Error invalidating cache:', error);
        }
    }

    static async blacklistToken(token, expirationTime) {
        try {
            if (redis.status !== 'ready') {
                console.log('Redis not available, skipping blacklist');
                return false;
            }

            const key = `${TOKEN_BLACKLIST_PREFIX}${token}`;
            await redis.set(key, 'blacklisted');
            
            if (expirationTime) {
                const ttl = expirationTime - Math.floor(Date.now() / 1000);
                if (ttl > 0) {
                    await redis.expire(key, ttl);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error blacklisting token:', error);
            return false;
        }
    }

    static async isTokenBlacklisted(token) {
        try {
            if (redis.status !== 'ready') {
                console.log('Redis not available, assuming token is not blacklisted');
                return false;
            }

            const exists = await redis.exists(`${TOKEN_BLACKLIST_PREFIX}${token}`);
            return exists === 1;
        } catch (error) {
            console.error('Error checking blacklisted token:', error);
            return false;
        }
    }
    static async storeBloodSugarMeasurements(deviceId, bloodSugar) {
        try {
            if (redis.status !== 'ready') {
                console.log('Redis not available, skipping blood sugar storage');
                return false;
            }

            const key = `${BLOOD_SUGAR_PREFIX}${deviceId}`;
            
            // Get existing measurements
            let measurements = await redis.get(key);
            measurements = measurements ? JSON.parse(measurements) : [];
            
            // Add new measurement
            measurements.push(bloodSugar);
            
            // Keep only last 5 measurements
            if (measurements.length > 5) {
                measurements = measurements.slice(-5);
            }

            // Store updated measurements
            await redis.setex(key, BLOOD_SUGAR_EXPIRATION, JSON.stringify(measurements));

            console.log(`Blood sugar measurements stored for device ${deviceId}`);
            return true;
        } catch (error) {
            console.error('Error storing blood sugar measurements:', error);
            return false;
        }
    }

    static async getBloodSugarMeasurements(deviceId) {
        try {
            if (redis.status !== 'ready') {
                console.log('Redis not available, returning null');
                return null;
            }

            const key = `${BLOOD_SUGAR_PREFIX}${deviceId}`;
            const data = await redis.get(key);
            
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting blood sugar measurements:', error);
            return [];
        }
    }

}
module.exports=RedisService;