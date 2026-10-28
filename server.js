const express=require("express"),http=require("http"),{Server}=require("socket.io");
const app=express(),server=http.createServer(app),io=new Server(server);
app.use(express.static("public")); const PORT=process.env.PORT||3000;
const players={}; const world={w:1800,h:1100};
const towers=[{id:"bt",team:"blue",x:260,y:550,hp:1200,maxHp:1200},{id:"rt",team:"red",x:1540,y:550,hp:1200,maxHp:1200}];
const bases=[{id:"bb",team:"blue",x:100,y:550,hp:2500,maxHp:2500},{id:"rb",team:"red",x:1700,y:550,hp:2500,maxHp:2500}];
const pub=p=>({id:p.id,name:p.name,team:p.team,x:p.x,y:p.y,hp:p.hp,maxHp:p.maxHp,level:p.level,gold:p.gold,score:p.score,deaths:p.deaths,alive:p.alive,skillReadyAt:p.skillReadyAt});
function broadcast(){io.emit("state",{players:Object.values(players).map(pub),towers,bases});}
function respawn(p){setTimeout(()=>{if(!players[p.id])return;p.hp=p.maxHp;p.alive=true;p.x=p.team==="blue"?170:1630;p.y=550+(Math.random()*180-90);broadcast()},3500)}
function damage(attacker,target,amount){if(!target||!target.alive||target.team===attacker.team)return;target.hp-=amount;if(target.hp<=0){target.hp=0;target.alive=false;target.deaths++;attacker.score++;attacker.gold+=250;attacker.level=Math.min(15,attacker.level+1);io.emit("notice",attacker.name+" đã hạ gục "+target.name+"!");respawn(target)}}
io.on("connection",s=>{
 const blue=Object.values(players).filter(p=>p.team==="blue").length,red=Object.values(players).filter(p=>p.team==="red").length,team=blue<=red?"blue":"red";
 const p={id:s.id,name:"Player "+s.id.slice(0,4),team,x:team==="blue"?170:1630,y:550+(Math.random()*180-90),hp:1000,maxHp:1000,level:1,gold:500,score:0,deaths:0,alive:true,skillReadyAt:0,lastAttack:0};
 players[s.id]=p;s.emit("welcome",{id:s.id,team,world});broadcast();
 s.on("rename",n=>{if(typeof n==="string")p.name=n.trim().slice(0,16)||p.name});
 s.on("move",v=>{if(!p.alive||!v)return;let dx=Math.max(-1,Math.min(1,Number(v.dx)||0)),dy=Math.max(-1,Math.min(1,Number(v.dy)||0)),l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;let speed=5.2+(p.level-1)*.12;p.x=Math.max(55,Math.min(world.w-55,p.x+dx*speed));p.y=Math.max(70,Math.min(world.h-70,p.y+dy*speed));});
 s.on("attack",id=>{let now=Date.now(),t=players[id];if(!p.alive||now-p.lastAttack<650)return;p.lastAttack=now;if(t&&t.alive&&t.team!==p.team&&Math.hypot(t.x-p.x,t.y-p.y)<=190)damage(p,t,110+(p.level-1)*12)});
 s.on("skill",id=>{let now=Date.now(),t=players[id];if(!p.alive||now<p.skillReadyAt)return;p.skillReadyAt=now+7000;if(t&&t.alive&&t.team!==p.team&&Math.hypot(t.x-p.x,t.y-p.y)<=290)damage(p,t,240+(p.level-1)*18)});
 s.on("disconnect",()=>{delete players[s.id];broadcast()});
});
setInterval(broadcast,50);server.listen(PORT,()=>console.log("Arena Legends running on "+PORT));