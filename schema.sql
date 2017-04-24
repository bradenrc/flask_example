drop table if exists entries;
create table entries (
  id integer primary key autoincrement,
  title text not null,
  'text' text not null
);


drop table if exists wapi;
create table wapi (
  id integer primary key autoincrement,
  name text not null,
  gender text not null,
  marital text not null,
  age text not null,
  job text not null
);
