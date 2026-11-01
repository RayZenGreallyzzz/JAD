/* Phoenix Starship Builder • stable module catalog (metres) */
(function(){'use strict';
const rows=[
'beam2|frame|Балка 2 м|0.5,0.5,2|box|2',
'beam4|frame|Балка 4 м|0.5,0.5,4|box|4',
'cross2|frame|Поперечина 2 м|2,0.5,0.5|box|2',
'cross4|frame|Поперечина 4 м|4,0.5,0.5|box|4',
'joint|frame|Силовой узел|1,1,1|cylinder|5',
'pillar|frame|Стойка|0.5,2,0.5|box|2',
'bulkhead|frame|Переборка|4,3,0.5|box|8',
'pylon|frame|Пилон двигателя|1,1,2|box|5',
'plate1|armor|Плита 1×1|1,0.5,1|box|1',
'plate2|armor|Плита 2×2|2,0.5,2|box|3',
'plate4|armor|Плита 4×2|4,0.5,2|box|6',
'hull|armor|Корпусный блок|2,1,2|box|7',
'wedge|armor|Носовой клин|2,1,2|wedge|3',
'widewedge|armor|Широкий обтекатель|4,1,3|wedge|6',
'slope|armor|Наклонная броня|2,1,2|wedge|3',
'wingL|armor|Левое крыло|4,0.5,2|wingL|4',
'wingR|armor|Правое крыло|4,0.5,2|wingR|4',
'cap|armor|Кормовой кожух|2,1,1|box|3',
'canopy|armor|Кабина пилота|2,1.5,3|wedge|4',
'window|armor|Панель с окном|2,1.5,0.5|box|2',
'hatch|armor|Технический люк|2,0.5,2|box|2',
'fin|armor|Киль|0.5,2,2|fin|2',
'deck|interior|Палуба 2×2|2,0.5,2|box|2',
'deck4|interior|Палуба 4×2|4,0.5,2|box|4',
'wall|interior|Стена отсека|2,2,0.5|box|2',
'door|interior|Дверь / шлюз|2,2,0.5|box|2',
'console|interior|Пульт управления|1,1,1|box|2',
'seat|interior|Кресло пилота|1,1.5,1|box|1',
'reactor|interior|Реактор|2,2,2|cylinder|7',
'bunk|interior|Койка|1,1,2|box|2',
'engineS|system|Маневровый двигатель|1,1,2|cylinder|5',
'engineL|system|Главный двигатель|2,2,3|cylinder|12',
'turret|system|Поворотная турель|2,1.5,2|turret|8',
'laser|system|Лазерная турель|1.5,1.5,2|turret|5',
'missile|system|Ракетный блок|2,1,2|box|6',
'radar|system|Радар|1,2,1|cylinder|2',
'shield|system|Генератор щита|2,1,2|cylinder|6',
'dock|system|Стыковочный узел|2,1,2|box|4'
];
const modules=rows.map(s=>{const [id,cat,name,dim,shape,mass]=s.split('|');return{id,cat,name,dim:dim.split(',').map(Number),shape,mass:Number(mass)}});
const byId=Object.fromEntries(modules.map(m=>[m.id,m]));
const presets={
 blank:[],
 scout:[['beam4',0,0,0],['cross2',0,0,-1],['cross2',0,0,1],['joint',0,0,2]],
 fighter:[['beam4',0,0,0],['beam2',0,0,-3],['cross4',0,0,-1],['cross4',0,0,1],['joint',-2,0,1],['joint',2,0,1]],
 frigate:[['beam4',0,0,-4],['beam4',0,0,0],['beam4',0,0,4],['cross4',0,0,-4],['cross4',0,0,0],['cross4',0,0,4],['beam4',-2,0,0],['beam4',2,0,0],['pillar',0,1,0]],
 carrier:[['beam4',-3,0,-4],['beam4',3,0,-4],['beam4',-3,0,0],['beam4',3,0,0],['beam4',-3,0,4],['beam4',3,0,4],['cross4',0,0,-4],['cross4',0,0,0],['cross4',0,0,4],['pillar',-3,1,0],['pillar',3,1,0]]
};
window.PSB={modules,byId,presets,version:1,maxModules:350,defaultColor:'#edf2f7'};
})();