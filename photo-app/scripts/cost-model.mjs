// Scenario calculator, not measured hosting/FX/payment quotes.
const fx=Number(process.env.PHOTO_SCENARIO_KRW_PER_USD??1500),failureRate=Number(process.env.PHOTO_SCENARIO_RETRY_RATE??0.15),pgRate=Number(process.env.PHOTO_SCENARIO_PG_RATE??0.035),storageAndCpuPerImage=Number(process.env.PHOTO_SCENARIO_INFRA_KRW??10);
if(![fx,failureRate,pgRate,storageAndCpuPerImage].every(Number.isFinite)||fx<=0||failureRate<0||failureRate>=1||pgRate<0||pgRate>=1||storageAndCpuPerImage<0)throw new Error('Invalid cost scenario');
const apiUSD=0.04; // fal pricing page, normalized 1MP; endpoint bill must still be measured.
const cases=[];for(const [plan,price,credits] of [['pack',4900,30],['pro',19900,150]])for(const cost of [1,3,5]){
  const count=credits/cost,apiPerImage=cost===1?0:apiUSD*fx/(1-failureRate),variable=count*(apiPerImage+storageAndCpuPerImage)+price*pgRate,netRevenue=price/1.1;
  cases.push({plan,creditsPerImage:cost,images:count,netRevenueKRW:Number(netRevenue.toFixed(2)),variableCostKRW:Number(variable.toFixed(2)),variableCostRatio:Number((variable/netRevenue).toFixed(4)),target30Percent:variable/netRevenue<=0.3});
}
console.log(JSON.stringify({status:'scenario-not-live-unit-economics',assumptions:{fx,failureRate,pgRate,storageAndCpuPerImage,apiUSD,vatFactor:1.1},exclusions:['actual PG contract','real hosting bill','email cost','support and refunds','higher resolution surcharge','free-trial acquisition cost'],cases},null,2));
