## Librerias
library(stringdist)
library(plyr)
library(dplyr)
library(stringr)
## ----------------------------------------
## Global Variables
## ----------------------------------------

the_labels <- c("Cocoon",
                "Eli Corame",
                "Ema Valdemosa",
                "Lessan",
                "Libertad",
                "D mosseli",
                "Neon Nyx",
                "Nicoletta",
                "Punto Blanco",
                "D Moseli",
                "Bianchi",
                "Interno")

the_provs <- c("Cocoon",
               "Eli Corame",
               "Ema Valdemosa",
               "Lessan",
               "Libertad",
               "Neon Nyx",
               "Nicoletta",
               "Punto Blanco",
               "D Moseli",
               "Bianchi",
               "Interno")

assign_prov_marca <- function(prov, the_field){
    if(is.na(prov)){
        return(length(the_field) + 1)
    }
    which.min(stringdist(prov,
                         the_field,
                         method = 'jaccard'))[1]
}

assign_m_prov <- function(prov, the_field){
    laply(prov, function(t) t <- assign_prov_marca(t, the_field))
}

get_prov <- function(text){
    mod  <- str_extract(text, '^[^ ]+')
    prov <- str_replace(text, '^[^ ]+', '') %>%
        str_trim()
    c(mod, prov)
}

## ----------------------------------------
## Read in data
## ----------------------------------------



###########################################
## GOOD Old trial iter
###########################################
## Clean
data <- read.csv('../data/MARIANA2.csv',
                 stringsAsFactors = FALSE) %>%
    `colnames<-` (c('modelo',
                    'existencias_ant',
                    'n_existencias',
                    'dev',
                    'precio',
                    'pzas_ve',
                    'to_ve',
                    'x_ve',
                    'descripcion')) %>%
    select(modelo, n_existencias, precio, descripcion) %>%
    filter(!is.na(modelo))
### ----------------------------------------
### DIRTY
### ----------------------------------------
## Separar modelo de proveedor
mod_provs <- llply(data$modelo, get_prov)
mod_provs <- data.frame(do.call(rbind, mod_provs))
names(mod_provs)<- c('modelo', 'proveedor')
## Asignar id de proveedor
mod_provs$prov_id <- assign_m_prov(mod_provs$proveedor, the_provs)
## Asignar id de marca
mod_provs$label_id <- assign_m_prov(mod_provs$proveedor, the_labels)
## Cambiar y ajustar nombres
mod_provs$proveedor <- NULL
names(mod_provs)<- c('modelo', 'id_proveedor', 'id_marca')
## Unificar data con provs
data$modelo <- NULL
data <- cbind(data, mod_provs)
data$costo <- data$precio
data$precio <- data$costo * 2
## DATOS LIMPIOS
clean_data <- data
clean_data$descripcion[is.na(clean_data$descripcion)] <- ''
clean_data$id_tienda <- 4
clean_data$notas <- ''
clean_data <- clean_data %>%
    select(modelo, n_existencias, precio, descripcion,
           id_proveedor, id_marca, costo, id_tienda, notas) %>%
    filter(costo > 0)

clean_data$articulo <- 'Prenda'

write.csv(clean_data, '../output_data/mariana.csv', row.names = FALSE)
