const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
p.droidClawAction.findFirst({where:{id:'cmlr3xwgy0001vtsgnbq46apv'}})
  .then(r => { console.log(r.status, r.error || ''); p.$disconnect(); });
